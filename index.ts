import express from "express";
import routes from "./src/routes";

const app = express();

app.use(express.json());
app.use("/api", routes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message ?? "Server error" });
});



const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Job portal API on http://localhost:${PORT}`));
