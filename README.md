# ValuePulse AI - Updated Architecture

Final architecture implemented in this project:

1. Frontend Dashboard
2. Machine Learning Model
3. Prediction API
4. Customer Analytics

## What was added

- New ML prediction model with the same output interface as the existing rule-based model.
- Shared `Prediction API` layer in `app.js`:
  - `predictionApi.predict(input, modelType)`
  - `predictionApi.predictBatch(records, modelType)`
- Model selector in Prediction Studio (`Machine Learning Model` or `Rule-Based Engine`).
- Model Pipeline tab updated to reflect the final architecture.

## Dataset included

- Training dataset: `data/customer_clv_training_dataset.csv`
- Upload test dataset: `data/sample_customer_upload.csv`

The ML model metadata in the app points to `data/customer_clv_training_dataset.csv` as the dataset used.
