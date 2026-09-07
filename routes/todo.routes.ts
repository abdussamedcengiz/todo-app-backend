import { Router } from "express";
import * as todoController from "../controllers/todo.controller";
import { auth } from "../middleware/auth";
import {
  createTodoSchema,
  updatePrioritySchema,
  updateTextSchema,
} from "../schemas";
import { validate, validateIdParam } from "../middleware/validate";

const router = Router();

// Bu router'in TAMAMI korumali: her istek once JWT dogrulamasindan
// gecer. Tek satir, endpoint basina tekrar yok -- ve yeni bir
// endpoint eklerken korumayi eklemeyi unutmak imkansiz.
router.use(auth);

router.get("/", todoController.listTodos);

router.post("/", validate(createTodoSchema), todoController.createTodo);

// DIKKAT: "/completed/all" bu dosyada "/:id"den SONRA tanimli ama
// catisma YOK -- ":id" tek bir yol parcasi eslestirir, iki parcali
// "/completed/all" ona uymaz. Yine de sabit yolu once yazmak,
// ileride ":id/*" bicimli bir route eklenirse olusacak karisikligi
// bastan onler.
router.delete("/completed/all", todoController.deleteCompletedTodos);

// validateIdParam: "/todos/abc" artik route'a hic ulasmiyor.
// Onceden Number("abc") -> NaN Prisma'ya gidiyor ve 400 yerine
// 500 donuyordu.
router.put("/:id", validateIdParam, todoController.toggleTodo);

router.put(
  "/:id/text",
  validateIdParam,
  validate(updateTextSchema),
  todoController.updateTodoText,
);

router.put(
  "/:id/priority",
  validateIdParam,
  validate(updatePrioritySchema),
  todoController.updateTodoPriority,
);

router.delete("/:id", validateIdParam, todoController.deleteTodo);

export default router;
