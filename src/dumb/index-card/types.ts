export type IndexCardElement =
  | {
      type: 'SmallText'
      text: string
    }
  | {
      type: 'NormalText'
      text: string
    }
  | {
      type: 'LargeText'
      text: string
    }
  | {
      type: 'DivisionLine'
    }
