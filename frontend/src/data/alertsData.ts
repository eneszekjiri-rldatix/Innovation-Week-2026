import type { Alert, AuditEvent, ChartDataPoint } from '../types/alerts';

function trendedData(days: number, start: number, end: number, noise: number): number[] {
  return Array.from({ length: days }, (_, i) => {
    const progress = i / (days - 1);
    const trend = start + (end - start) * progress;
    const jitter =
      Math.sin(i * 2.3 + 1) * noise + Math.cos(i * 1.7 + 2) * noise * 0.6;
    return Math.round((trend + jitter) * 10) / 10;
  });
}

function buildChartData(
  config: {
    rubDuration: [number, number];
    numberOfEvents: [number, number];
    bareElbows: [number, number];
    poorHandDrying: [number, number];
  },
  noise = 1.5
): ChartDataPoint[] {
  const days = 30;
  const rub = trendedData(days, config.rubDuration[0], config.rubDuration[1], noise);
  const events = trendedData(days, config.numberOfEvents[0], config.numberOfEvents[1], noise * 0.6);
  const elbows = trendedData(days, config.bareElbows[0], config.bareElbows[1], noise * 0.8);
  const drying = trendedData(days, config.poorHandDrying[0], config.poorHandDrying[1], noise * 0.7);
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    rubDuration: rub[i],
    numberOfEvents: events[i],
    bareElbows: elbows[i],
    poorHandDrying: drying[i],
  }));
}

function makeEvents(specs: { date: string; times: string[] }[]): AuditEvent[] {
  let idx = 0;
  return specs.flatMap(({ date, times }) =>
    times.map((time) => ({ id: `evt-${idx++}`, date, time }))
  );
}

export const ALERTS: Alert[] = [
  {
    id: 'alert-icu-1',
    auditType: 'Hand Hygiene',
    date: '23 July 2026',
    unit: 'Intensive Care Unit',
    events: ['Rub duration dropped below acceptable levels'],
    standards: [
      {
        metric: 'Rub Duration',
        description:
          'Following WHO guidelines, mandates that hand hygiene must be performed for a duration sufficient to ensure all surfaces of the hands are covered and treated. For Alcohol-Based Hand Rub (ABHR), the process should take 20–30 seconds, while hand washing with soap and water should take 40–60 seconds. The duration is not merely about time elapsed but ensures that the mechanical action of rubbing covers all areas—including palms, backs of hands, between fingers, thumbs, and wrists—until the product has evaporated or been thoroughly rinsed.',
        events: makeEvents([
          { date: '16 June 2026', times: ['08:14', '09:02', '10:45', '11:33', '13:07', '14:22', '15:58'] },
          { date: '17 June 2026', times: ['08:31', '09:44', '11:02', '12:19', '14:05', '15:41', '16:28'] },
          { date: '18 June 2026', times: ['08:07', '10:11', '11:55', '13:32', '15:08'] },
          { date: '19 June 2026', times: ['09:16', '11:38', '14:02'] },
          { date: '20 June 2026', times: ['08:52'] },
        ]),
      },
    ],
    chartData: buildChartData({ rubDuration: [82, 63], numberOfEvents: [90, 88], bareElbows: [86, 84], poorHandDrying: [76, 74] }),
  },
  {
    id: 'alert-amw-1',
    auditType: 'Hand Hygiene',
    date: '23 July 2026',
    unit: 'Acute Medical Ward',
    events: ['Daily hand washing events have dropped below average'],
    standards: [
      {
        metric: 'Event Frequency',
        description:
          "The World Health Organization's Five Moments for Hand Hygiene framework mandates hand hygiene before touching a patient, before clean/aseptic procedures, after body fluid exposure risk, after touching a patient, and after touching patient surroundings. Compliance requires a minimum frequency of hand hygiene actions per patient contact hour to prevent cross-contamination. A reduction in event count per observed opportunity signals deteriorating compliance and increases infection transmission risk across the ward.",
        events: makeEvents([
          { date: '14 June 2026', times: ['09:05', '11:22', '14:44', '16:10'] },
          { date: '15 June 2026', times: ['08:33', '10:58', '13:27', '15:01'] },
          { date: '16 June 2026', times: ['09:41', '12:15', '14:39'] },
          { date: '17 June 2026', times: ['10:04', '13:52'] },
          { date: '18 June 2026', times: ['11:30', '14:08'] },
          { date: '19 June 2026', times: ['09:58'] },
        ]),
      },
    ],
    chartData: buildChartData({ rubDuration: [82, 79], numberOfEvents: [88, 65], bareElbows: [85, 83], poorHandDrying: [78, 76] }),
  },
  {
    id: 'alert-hdu-1',
    auditType: 'Hand Hygiene',
    date: '23 July 2026',
    unit: 'HDU',
    events: [
      'Rub duration dropped below acceptable levels',
      'Bare Below the Elbows (BBE) not observed',
    ],
    standards: [
      {
        metric: 'Rub Duration',
        description:
          'Following WHO guidelines, mandates that hand hygiene must be performed for a duration sufficient to ensure all surfaces of the hands are covered and treated. For Alcohol-Based Hand Rub (ABHR), the process should take 20–30 seconds, while hand washing with soap and water should take 40–60 seconds.',
        events: makeEvents([
          { date: '16 June 2026', times: ['08:14', '09:02', '10:45', '11:33', '13:07', '14:22', '15:58'] },
          { date: '17 June 2026', times: ['08:31', '09:44', '11:02', '12:19', '14:05', '15:41'] },
          { date: '18 June 2026', times: ['08:07', '10:11', '11:55', '13:32', '15:08'] },
          { date: '19 June 2026', times: ['09:16', '11:38', '14:02'] },
          { date: '20 June 2026', times: ['08:52'] },
        ]),
      },
      {
        metric: 'Bare Below the Elbows (BBE)',
        description:
          'Clinical staff are required to be Bare Below the Elbows (BBE) when engaged in direct patient care. This standard prohibits wearing long sleeves, wristwatches, jewellery, and false nails, as these can harbour pathogens and impede effective hand and wrist decontamination. Non-compliance with BBE policy significantly reduces the efficacy of hand hygiene procedures and is associated with increased healthcare-associated infection rates.',
        events: makeEvents([
          { date: '16 June 2026', times: ['09:02', '10:45', '13:07'] },
          { date: '17 June 2026', times: ['09:44', '14:05'] },
          { date: '18 June 2026', times: ['15:08'] },
        ]),
      },
    ],
    chartData: buildChartData({ rubDuration: [80, 68], numberOfEvents: [89, 87], bareElbows: [82, 67], poorHandDrying: [77, 75] }),
  },
];

export const UNITS = ['All Units', 'Intensive Care Unit', 'Acute Medical Ward', 'HDU'];
