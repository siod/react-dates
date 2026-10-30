import {
  TypeScriptDateRangePickerExample,
  TypeScriptRangeControllerExample,
  TypeScriptSingleDatePickerExample,
} from '../examples/TypeScriptUsage.js';

const meta = {
  title: 'TypeScript Usage',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} as const;

export default meta;

export const DateRangePicker = {
  render: () => <TypeScriptDateRangePickerExample />,
};

export const SingleDatePicker = {
  render: () => <TypeScriptSingleDatePickerExample />,
};

export const RangeController = {
  render: () => <TypeScriptRangeControllerExample />,
};
