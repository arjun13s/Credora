import { runSyntheticEvaluatorCases } from "../src/lib/eval-runner";

async function main() {
  const results = await runSyntheticEvaluatorCases();
  const failed = results.filter((result) => !result.passed);

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`${status} ${result.caseId}`);
    for (const message of result.messages) {
      console.log(`  - ${message}`);
    }
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} evaluator case(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length} evaluator cases passed.`);
}

void main();
