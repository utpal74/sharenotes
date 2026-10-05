import { createApplication } from './create-application.js';

async function bootstrap() {
  const app = await createApplication();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`ShareNotes API listening on port ${port}`);
}
await bootstrap();
