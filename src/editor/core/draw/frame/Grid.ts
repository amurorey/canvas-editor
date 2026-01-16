import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export interface IGridSpacing {
  originX: number
  originY: number
  horizontalSpacing: number
  verticalSpacing: number
}

export class Grid {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public getSpacing(): IGridSpacing {
    const { grid, defaultSize, defaultBasicRowMarginHeight, scale } =
      this.options
    const margins = this.draw.getMargins()
    const originX = margins[3]
    const originY = margins[0]
    const horizontalSpacing =
      (grid.horizontalSpacing || defaultSize) * scale || defaultSize * scale
    const availableHeight = this.draw.getHeight() - margins[0] - margins[2]
    const verticalSpacing = grid.linesPerPage
      ? availableHeight / grid.linesPerPage
      : (grid.verticalSpacing ||
          defaultSize + defaultBasicRowMarginHeight * 2) * scale
    return {
      originX,
      originY,
      horizontalSpacing,
      verticalSpacing
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { grid } = this.options
    if (grid.disabled || !grid.show) return
    const { color, lineWidth, alpha, showVertical, showHorizontal } = grid
    if (!showVertical && !showHorizontal) return
    const { originX, originY, horizontalSpacing, verticalSpacing } =
      this.getSpacing()
    // 避免零间隔导致死循环
    if (!horizontalSpacing || !verticalSpacing) return
    const width = this.draw.getInnerWidth()
    const height = this.draw.getHeight() - originY - this.draw.getMargins()[2]
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth * this.options.scale
    ctx.translate(0.5, 0.5)
    // 垂直线
    if (showVertical) {
      const verticalCount = Math.floor(width / horizontalSpacing) + 1
      for (let i = 0; i <= verticalCount; i++) {
        const x = originX + i * horizontalSpacing
        ctx.beginPath()
        ctx.moveTo(x, originY)
        ctx.lineTo(x, originY + height)
        ctx.stroke()
      }
    }
    // 水平线
    if (showHorizontal) {
      const horizontalCount = Math.floor(height / verticalSpacing) + 1
      for (let j = 0; j <= horizontalCount; j++) {
        const y = originY + j * verticalSpacing
        ctx.beginPath()
        ctx.moveTo(originX, y)
        ctx.lineTo(originX + width, y)
        ctx.stroke()
      }
    }
    ctx.restore()
  }
}
