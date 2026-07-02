import isAbsoluteUrl from 'is-absolute-url'

const BASE_PICTURE_URL = `${process.env.VITE_BASE_API}/uploads/images`

export default {
  getPicture: url => {
    if (isAbsoluteUrl(String(url))) {
      return url
    } else {
      return `${BASE_PICTURE_URL}/${url}`
    }
  }
}
