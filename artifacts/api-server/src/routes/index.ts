import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import villagesRouter from "./villages";
import photosRouter from "./photos";
import videosRouter from "./videos";
import chatRouter from "./chat";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(villagesRouter);
router.use(photosRouter);
router.use(videosRouter);
router.use(chatRouter);
router.use(statsRouter);

export default router;
