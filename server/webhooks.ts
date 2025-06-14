import express from 'express';
const router = express.Router();

// Replace with your actual data cleanup logic
async function deleteStoreData(body: any) {
  // TODO: Clean up store data from your database
  return;
}

router.post('/webhooks/app/uninstalled', async (req, res) => {
  await deleteStoreData(req.body);
  res.status(200).send();
});

export default router;
