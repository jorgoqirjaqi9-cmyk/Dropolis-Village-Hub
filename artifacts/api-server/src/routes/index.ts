import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import villagesRouter from "./villages";
import photosRouter from "./photos";
import videosRouter from "./videos";
import chatRouter from "./chat";
import statsRouter from "./stats";
import sitemapRouter from "./sitemap";
import indexNowRouter from "./indexnow";
import rssRouter from "./rss";
import socialRouter from "./social";
import indexingRouter from "./indexing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sitemapRouter);
router.use(indexNowRouter);
router.use(articlesRouter);
router.use(villagesRouter);
router.use(photosRouter);
router.use(videosRouter);
router.use(chatRouter);
router.use(statsRouter);
router.use(rssRouter);
router.use(socialRouter);
router.use(indexingRouter);

export default router;
