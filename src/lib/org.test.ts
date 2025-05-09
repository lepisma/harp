import { expect, test } from 'vitest';
import { parseTags, parseMetricValues } from './org';

test('Tag parsing', () => {
  let text = `I am going to #tag this note
with #some-tags
and also
#start-tag #note(2)
`;

  let parsed = parseTags(text);

  expect(parsed).toEqual(['tag', 'some-tags', 'start-tag']);
})

test('Metric value parsing', () => {
  let text = `I am going to #tag this note
with #some-tags
and also
#start-tag #note(2)
`;

  let dt = new Date();
  let ref = 'NA';
  let parsed = parseMetricValues(text, dt, ref);

  expect(parsed).toEqual([{ id: 'note', value: 2, datetime: dt, reference: ref }]);
})
