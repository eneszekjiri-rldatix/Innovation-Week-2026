import { createFileRoute } from '@tanstack/react-router'
import { AddFindingDialog } from '../components/AddFindingDialog'

export const Route = createFileRoute('/_main/scratch-dialog-test')({
  component: () => (
    <AddFindingDialog open onClose={() => {}} onSubmit={() => {}} />
  ),
})
