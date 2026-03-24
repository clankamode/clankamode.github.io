import { runDailyBrief } from './dailyBrief';

export async function GET() {
  return runDailyBrief();
}
