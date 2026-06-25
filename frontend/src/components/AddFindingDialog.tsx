import { useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CommonDialog } from '@rld-engineering/base-camp-react';
import type { Dayjs } from 'dayjs';

export interface FindingFormValues {
  summary: string;
  description: string;
  dueDate: Dayjs | null;
}

interface AddFindingDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FindingFormValues) => void;
}

const EMPTY_VALUES: FindingFormValues = { summary: '', description: '', dueDate: null };

function CorrectiveActionForm({
  values,
  onChange,
}: {
  values: FindingFormValues;
  onChange: (values: FindingFormValues) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 420, pt: 1 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#151d1e' }}>Corrective Action</Typography>

      <TextField
        label="Summary"
        variant="standard"
        fullWidth
        required
        value={values.summary}
        onChange={(e) => onChange({ ...values, summary: e.target.value })}
      />

      <TextField
        label="Description"
        variant="standard"
        fullWidth
        required
        multiline
        minRows={2}
        value={values.description}
        onChange={(e) => onChange({ ...values, description: e.target.value })}
      />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Due Date"
          value={values.dueDate}
          onChange={(date) => onChange({ ...values, dueDate: date })}
          format="MM/DD/YYYY"
          slotProps={{ textField: { variant: 'standard', fullWidth: true, required: true } }}
        />
      </LocalizationProvider>
    </Box>
  );
}

export function AddFindingDialog({ open, onClose, onSubmit }: AddFindingDialogProps) {
  const [values, setValues] = useState<FindingFormValues>(EMPTY_VALUES);

  function handleClose() {
    setValues(EMPTY_VALUES);
    onClose();
  }

  function handleSubmit() {
    onSubmit(values);
    setValues(EMPTY_VALUES);
  }

  const isValid = values.summary.trim() !== '' && values.description.trim() !== '' && values.dueDate != null;

  return (
    <CommonDialog
      open={open}
      setOpen={(next) => {
        if (!next) handleClose();
      }}
      props={{
        title: 'Add Finding',
        component: () => <CorrectiveActionForm values={values} onChange={setValues} />,
        onCancel: handleClose,
        onSubmit: handleSubmit,
        submitText: 'Add Finding',
        submitDisabled: !isValid,
        maxWidth: 'sm',
      }}
    />
  );
}
