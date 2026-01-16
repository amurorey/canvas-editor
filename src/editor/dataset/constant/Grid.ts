import { IGridOption } from '../../interface/Grid'

export const defaultGridOption: Required<IGridOption> = {
  disabled: true,
  show: false,
  showVertical: true,
  showHorizontal: true,
  horizontalSpacing: 20,
  verticalSpacing: 20,
  linesPerPage: 0,
  snapEnabled: true,
  snapThreshold: 6,
  color: '#d9d9d9',
  lineWidth: 1,
  alpha: 0.4,
  alignTextToGrid: false
}
