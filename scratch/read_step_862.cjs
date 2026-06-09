const fs = require('fs');
const readline = require('readline');

const logPath = '/Users/diego/.gemini/antigravity-ide/brain/0e84ae12-92ce-41ae-b864-c2b9ebc476d5/.system_generated/logs/transcript.jsonl';

async function processLog() {
    if (!fs.existsSync(logPath)) {
        console.error('Log file not found at:', logPath);
        return;
    }

    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const step = JSON.parse(line);
            if (step.step_index >= 860 && step.step_index <= 865) {
                console.log(`\n--- STEP ${step.step_index} (${step.source} - ${step.type}) ---`);
                console.log('Content:', step.content);
                if (step.tool_calls) {
                    console.log('Tool Calls:', JSON.stringify(step.tool_calls, null, 2));
                }
            }
        } catch (e) {
            console.error('Error parsing line:', e);
        }
    }
}

processLog();
