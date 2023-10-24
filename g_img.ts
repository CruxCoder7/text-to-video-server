;(async () => {
  const key = process.env.GOOGLE_SEARCH_API_KEY as string
  const cx = process.env.GOOGLE_SEARCH_API_CX as string
  const q = "dogs"
  const data = await fetch(
    `${process.env.GOOGLE_SEARCH_API_ENDPOINT}?key=${key}&cx=${cx}&q=${q}`
  )
  const resp = await data.json()
  console.log(resp)

  const arr = []
  for (const res of resp.items) {
    arr.push(res.pagemap.cse_image[0].src)
  }
})()

// resp.items.pagemap.metatags[0]["og:image"]
// resp.items.pagemap.metatags[0].image
// resp.items.pagemap.cse_image[0].src
