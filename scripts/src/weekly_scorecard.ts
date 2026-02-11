import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TelemetryEvent {
    event_type: string;
    created_at: string;
    session_id: string;
}

async function main() {
    console.log('--- Weekly Scorecard ---\n');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch recent telemetry
    const { data: events, error } = await supabase
        .from('TelemetryEvents')
        .select('event_type, created_at, session_id')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to fetch telemetry:', error.message);
        process.exit(1);
    }

    // Fetch internalizations
    const { data: internalizations } = await supabase
        .from('UserInternalizations')
        .select('id, created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

    const counts: Record<string, number> = {
        gate_shown: 0,
        session_committed: 0,
        ritual_completed: 0,
        micro_shown: 0,
        micro_clicked: 0
    };

    const eventsBySession: Record<string, TelemetryEvent[]> = {};

    (events || []).forEach(e => {
        if (counts[e.event_type] !== undefined) {
            counts[e.event_type]++;
        }
        if (!eventsBySession[e.session_id]) eventsBySession[e.session_id] = [];
        eventsBySession[e.session_id].push(e);
    });

    // Compute time-to-commit (gate_shown -> session_committed) per session
    const timeToCommitMs: number[] = [];
    Object.values(eventsBySession).forEach(sessionEvents => {
        const gateShown = sessionEvents.find(e => e.event_type === 'gate_shown');
        const committed = sessionEvents.find(e => e.event_type === 'session_committed');
        if (gateShown && committed) {
            const delta = new Date(committed.created_at).getTime() - new Date(gateShown.created_at).getTime();
            if (delta > 0 && delta < 5 * 60 * 1000) { // sanity check: < 5 min
                timeToCommitMs.push(delta);
            }
        }
    });

    const medianTimeToCommit = timeToCommitMs.length > 0
        ? timeToCommitMs.sort((a, b) => a - b)[Math.floor(timeToCommitMs.length / 2)] / 1000
        : null;

    // Ratios
    const commitRate = counts.gate_shown > 0 ? (counts.session_committed / counts.gate_shown) * 100 : 0;
    const ritualRate = counts.session_committed > 0 ? (counts.ritual_completed / counts.session_committed) * 100 : 0;
    const microAcceptRate = counts.micro_shown > 0 ? (counts.micro_clicked / counts.micro_shown) * 100 : 0;

    // Internalization rate
    const internalSaved = (internalizations || []).length;
    const internalizationRate = counts.ritual_completed > 0 ? (internalSaved / counts.ritual_completed) * 100 : 0;

    console.log('📊 7-DAY RATIOS:');
    console.log(` - Commit Rate: ${commitRate.toFixed(1)}% (${counts.session_committed}/${counts.gate_shown})`);
    console.log(` - Ritual Completion Rate: ${ritualRate.toFixed(1)}% (${counts.ritual_completed}/${counts.session_committed})`);
    console.log(` - Micro Accept Rate: ${microAcceptRate.toFixed(1)}% (${counts.micro_clicked}/${counts.micro_shown})`);
    console.log(` - Internalization Rate: ${internalizationRate.toFixed(1)}% (${internalSaved}/${counts.ritual_completed})`);

    console.log('\n⏱️ TIME METRICS:');
    if (medianTimeToCommit !== null) {
        console.log(` - Median Time-to-Commit: ${medianTimeToCommit.toFixed(1)}s`);
    } else {
        console.log(' - Median Time-to-Commit: N/A (no data)');
    }

    console.log('\n📈 RAW COUNTS (7-day):');
    Object.entries(counts).forEach(([type, count]) => {
        console.log(` - ${type}: ${count}`);
    });
    console.log(` - internalizations_saved: ${internalSaved}`);

    console.log('\n--- End of Scorecard ---');
}

main().catch(console.error);
