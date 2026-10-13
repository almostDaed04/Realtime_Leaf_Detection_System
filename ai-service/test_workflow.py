
import os
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient

load_dotenv()

client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=os.environ["ROBOFLOW_API_KEY"],
)

result = client.run_workflow(
    workspace_name="manashvi-prajapati",
    workflow_id="siamweed-detection-1791832685967",
    images={
        "image": "test_leaf.jpg"
    },
)

print("Workflow response:")
print(result)
