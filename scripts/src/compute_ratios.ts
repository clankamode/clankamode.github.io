import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Telemetry Ratios Report ---');

    const { data: events, error } = await supabase
        .from('TelemetryEvents')
        .select('event_type');

    if (error || !events) {
        console.error('Failed to fetch telemetry events:', error?.message);
        process.exit(1);
    }

    const counts: Record<string, number> = {
        gate_shown: 0,
        session_committed: 0,
        item_completed: 0,
        micro_shown: 0,
        micro_clicked: 0,
        ritual_completed: 0
    };

    events.forEach(e => {
        if (counts[e.event_type] !== undefined) {
            counts[e.event_type]++;
        }
    });

    const commitRate = counts.gate_shown > 0 ? (counts.session_committed / counts.gate_shown) * 100 : 0;
    const microAcceptRate = counts.micro_shown > 0 ? (counts.micro_clicked / counts.micro_shown) * 100 : 0;
    const ritualCompletionRate = counts.session_committed > 0 ? (counts.ritual_completed / counts.session_committed) * 100 : 0;

    console.log(`\n📊 STATS:`);
    console.log(` - Commit Rate (session_committed / gate_shown): ${commitRate.toFixed(1)}%`);
    console.log(` - Micro Accept Rate (micro_clicked / micro_shown): ${microAcceptRate.toFixed(1)}%`);
    console.log(` - Ritual Completion Rate (ritual_completed / session_committed): ${ritualCompletionRate.toFixed(1)}%`);

    console.log(`\n📈 RAW COUNTS:`);
    Object.entries(counts).forEach(([type, count]) => {
        console.log(` - ${type}: ${count}`);
    });

    console.log('\n--- End of Report ---');
}

main().catch(console.error);
