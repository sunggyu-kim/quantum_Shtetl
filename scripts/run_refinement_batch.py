#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
from pathlib import Path


def run_inference(prompt: str, model: str, use_local: bool) -> str | None:
    try:
        cmd = ["openclaw", "infer", "model", "run"]
        if use_local:
            cmd.append("--local")
        cmd += ["--json", "--model", model, "--prompt", prompt]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)

        if isinstance(data, dict):
            outputs = data.get("outputs")
            if isinstance(outputs, list) and outputs:
                text = outputs[0].get("text")
                if isinstance(text, str) and text.strip():
                    return text
            for key in ("text", "content"):
                value = data.get(key)
                if isinstance(value, str) and value.strip():
                    return value
        return None
    except Exception as e:
        print(f"Error running inference: {e}")
        return None


def extract_json_block(text: str) -> dict | None:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[len("```json"):].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(cleaned[start:end])
            except json.JSONDecodeError:
                return None
        return None


def main():
    parser = argparse.ArgumentParser(description="Run a refinement batch through openclaw infer")
    parser.add_argument("batch_path", help="Input JSONL batch path")
    parser.add_argument("output_path", help="Output JSONL path")
    parser.add_argument("--model", default="openai-codex/gpt-5.4")
    parser.add_argument("--local", action="store_true", help="Use local transport")
    args = parser.parse_args()

    batch_path = Path(args.batch_path)
    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with batch_path.open("r", encoding="utf-8") as f_in, output_path.open("w", encoding="utf-8") as f_out:
        lines = [line for line in f_in if line.strip()]
        total = len(lines)
        for i, line in enumerate(lines, start=1):
            item = json.loads(line)
            post_id = item.get("post_id")
            print(f"Processing {i}/{total}: post_id={post_id}")

            response_text = run_inference(item.get("prompt", ""), args.model, args.local)
            if not response_text:
                print(f"No usable output for post_id={post_id}")
                continue

            result = extract_json_block(response_text)
            if not isinstance(result, dict):
                print(f"Failed to parse JSON for post_id={post_id}")
                continue

            result.setdefault("post_id", post_id)
            f_out.write(json.dumps(result, ensure_ascii=False) + "\n")
            f_out.flush()


if __name__ == "__main__":
    main()
