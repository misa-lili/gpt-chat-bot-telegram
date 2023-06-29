declare namespace BotAPI {
  /**
   * https://core.telegram.org/bots/api#file
   */
  interface File {
    file_id: string
    file_unique_id: string
    file_size?: number
    file_path?: string
  }

  /**
   * https://core.telegram.org/bots/api#inputsticker
   */
  interface InputSticker {
    sticker: InputFile | string
    emoji_list: string[]
    mask_position?: MaskPosition
    keywords?: string[]
  }

  /**
   * https://core.telegram.org/bots/api#inputfile
   */
  interface InputFile extends Buffer {}

  /**
   * https://core.telegram.org/bots/api#maskposition
   */
  interface MaskPosition {
    point: string
    x_shift: number
    y_shift: number
    scale: number
  }
}
