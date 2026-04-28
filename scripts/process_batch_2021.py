import json
import subprocess
import os
import sys

def process_record(record, model="openai-codex/gpt-5.4"):
    prompt = record.get("prompt")
    if not prompt:
        return None
    
    try:
        # Use openclaw infer model run --local --json
        cmd = [
            "openclaw", "infer", "model", "run",
            "--local",
            "--json",
            "--model", model,
            "--prompt", prompt
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        
        if data.get("ok") and data.get("outputs"):
            return data["outputs"][0]["text"]
        else:
            print(f"Error in model output for {record.get('post_id')}: {data}")
            return None
    except Exception as e:
        print(f"Exception processing {record.get('post_id')}: {e}")
        return None

def main():
    input_path = "projects/scott-aaronson-idea-atlas/data/derived/refinement_batches/post_refinement_batch_year_2021_gpt54_ko.jsonl"
    output_path = "projects/scott-aaronson-idea-atlas/data/derived/refinement_outputs/year_2021_gpt54_ko.jsonl"
    
    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(input_path, "r") as f_in, open(output_path, "w") as f_out:
        for line in f_in:
            if not line.strip():
                continue
            record = json.loads(line)
            post_id = record.get("post_id")
            print(f"Processing post_id: {post_id}...")
            
            output_text = process_record(record)
            if output_text:
                try:
                    # The output_text is expected to be a JSON string
                    # We need to parse it and add post_id if it's missing or just use it as is if it's valid
                    # The instructions say "Produce validated JSONL output"
                    # Usually the model returns a JSON block. 
                    # Sometimes it might have markdown backticks.
                    
                    cleaned_text = output_text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[len("```json"):].strip()
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3].strip()
                    
                    output_json = json.loads(cleaned_text)
                    # Ensure post_id matches
                    output_json["post_id"] = post_id
                    
                    f_out.write(json.dumps(output_json, ensure_ascii=False) + "\n")
                    f_out.flush()
                    print(f"Saved post_id: {post_id}")
                except Exception as e:
                    print(f"Failed to parse model output for {post_id}: {e}")
            else:
                print(f"Skipping post_id: {post_id} due to no output")

if __name__ == "__main__":
    main()
