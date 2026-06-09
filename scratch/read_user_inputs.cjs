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

    const userInputs = [];
    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const step = JSON.parse(line);
            if (step.type === 'USER_INPUT') {
                userInputs.push(step);
            }
        } catch (e) {
            console.error('Error parsing line:', e);
        }
    }

    console.log(`Total USER_INPUT steps: ${userInputs.length}`);
    userInputs.forEach(step => {
        console.log(`\n--- STEP ${step.step_index} (${step.created_at}) ---`);
        console.log(step.content);
    });
}

processLog();
