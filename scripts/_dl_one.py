import ssl, urllib.request
url = "https://iv.okcdn.ru/getVideoPreview?id=14484526664263&idx=0&type=39&tkn=i4l6AqosjvK0zgbeex9AwBv1cR0&fn=vid_w"
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://vkvideo.ru/"})
data = urllib.request.urlopen(req, timeout=20, context=ctx).read()
open(r"C:\Users\Admin\Desktop\КОД МЕСТА 2\site\assets\img\podcast\episodes\muzyka-piters.jpg", "wb").write(data)
print(len(data))
