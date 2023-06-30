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

  interface StickerSet {
    name: string
    title: string
    sticker_type: string
    is_animated: boolean
    is_video: boolean
    stickers: Sticker[]
    thumbnail: PhotoSize
  }

  interface Sticker {
    file_id: string
    file_unique_id: string
    type: "regular" | "mask" | "custom_emoji"
    width: number
    height: number
    is_animated: boolean
    is_video: boolean
    thumbnail?: PhotoSize
    emoji?: string
    set_name?: string
    premium_animation?: File
    mask_position?: MaskPosition
    custom_emoji_id?: string
    needs_repainting?: boolean
    file_size?: number
  }

  interface PhotoSize {
    file_id: string
    file_unique_id: string
    width: number
    height: number
    file_size?: number
  }
}
