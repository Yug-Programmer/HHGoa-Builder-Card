import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cardsRouter from "./cards";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cardsRouter);
router.use(adminRouter);

export default router;
