import resend, litedb, secrets_parser, time, json, os, threading, hashlib
from flask import Flask, request, Response, send_file

app = Flask(__name__)
secrets = secrets_parser.parse("secrets")
resend.api_key = secrets["resend"]

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return Response(status=200)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    return response

users = litedb.get_conn("users")
albums = litedb.get_conn("albums")

if users.count_all() == 0:
    users.set(secrets["admin_password"], secrets["admin_user"])

@app.get("/add_user")
def add_user():
    args = dict(request.args)
    if args["admin_password"] == secrets["admin_password"]:
        users.set(args["password"], {"username": args["username"], "password": args["password"], "name": args["name"], "email": args["email"], "albums": [], "created_at": time.time()})
        mail_html = open("mail/newUser.html").read()
        mail_html = mail_html.replace("{name}", args["name"]).replace("{password}", args["password"])

        resend.Emails.send({"from": "Aarav's Archive <mailing-list@archive.aaravdayal.com>", "to": args["email"], "subject": "You were added to the Aarav Dayal's personal archive", "reply_to": "aarav@dayal.org", "html": mail_html})

        return "true"
    else:
        return "false"

@app.get("/authenticate")
def check_password():
    args = dict(request.args)

    user_object = users.get(args["password"])

    if user_object in [None, False]:
        response = Response("false")
        response.headers.add("Content-Type", "application/json")
        return response
    
    allowed_keys = ["username", "password", "name", "email"]

    new_object = {}

    for x in allowed_keys:
        new_object[x] = user_object[x]

    response = Response(json.dumps(new_object))
    response.headers.add("Content-Type", "application/json")
    return response

def hash_album_path(path):
    return hashlib.sha256(str(path).encode()).hexdigest()[:16]

@app.get("/add_album")
def add_album():
    args = dict(request.args)

    if args["admin_user"] != secrets["admin_user"] or args["admin_password"] != secrets["admin_password"]:
        return "false"
    
    threads = []
    
    for folder in os.listdir(args["path"]):
        album_path = args["path"] + "/" + folder
        if ".DS_Store" in album_path: continue
        files = os.listdir(album_path)

        MOV = ""
        JPG = ""
        MP4 = ""

        for file in files:
            file_path = album_path + "/" + file

            if file_path.lower().endswith("mov"):
                MOV = file_path
            
            if file_path.lower().endswith("jpg"):
                JPG = file_path
            
            if file_path.lower().endswith("mp4"):
                MP4 = file_path

        if MOV != "":
            thread = threading.Thread(target=os.system, args=[f"ffmpeg -y -i \"{MOV}\" -c copy -movflags +faststart \"{os.path.splitext(MOV)[0]}.mp4\" > /dev/null 2>&1"])
            thread.start()
            threads.append(thread)
        
        if (MOV != "" or MP4 != "") and JPG == "":
            video = MOV

            if video == "":
                video = MP4

            thread = threading.Thread(target=os.system, args=[f"ffmpeg -y -ss 0.3 -i \"{video}\" -frames:v 1 -q:v 2 \"{os.path.splitext(video)[0]}\".JPG > /dev/null 2>&1"])
            thread.start()
            threads.append(thread)

    
    for thread in threads:
        thread.join()
    
    album_hash = hash_album_path(args["path"])

    albums.set(album_hash, {"id": album_hash, "path": args["path"], "time": args["time"], "location": args["location"], "people": [secrets["admin_password"]], "cover": args["cover"]})

    user_object = users.get(secrets["admin_password"])

    user_object["albums"] += [album_hash]

    user_object["albums"] = list(set(user_object["albums"]))

    users.set(secrets["admin_password"], user_object)

    return "true"

@app.get("/albums")
def get_albums_metadata():
    args = dict(request.args)

    user_object = users.get(args["password"])

    allowed_keys = ["id", "path", "time", "location", "people", "cover"]

    album_data = []

    for album in user_object["albums"]:
        album = albums.get(album)
        new_album = {}

        for x in allowed_keys:
            new_album[x] = album[x]

        album_data.append(new_album)

    response = Response(json.dumps(album_data))
    response.headers.add("Content-Type", "application/json")
    return response

@app.get("/album")
def get_album_metadata():
    args = dict(request.args)

    user_object = users.get(args["password"])

    allowed_keys = ["id", "path", "time", "location", "people", "cover"]

    if args["album"] not in user_object["albums"]:
        response = Response(json.dumps(False))
        response.headers.add("Content-Type", "application/json")
        return response

    album = albums.get(args["album"])

    new_album = {}
    for x in allowed_keys:
        new_album[x] = album[x]
    
    new_album["images"] = os.listdir(album["path"])

    response = Response(json.dumps(new_album))
    response.headers.add("Content-Type", "application/json")
    return response

@app.get("/get_image")
def get_image():
    args = dict(request.args)

    user_object = users.get(args["password"])

    if args["album"] not in user_object["albums"]:
        response = Response("false")
        response.headers.add("Content-Type", "application/json")
        return response
    
    album = albums.get(args["album"])

    if args["id"] == "cover":
        args["id"] = album["cover"]

    directory = os.listdir(album["path"] + "/" + args["id"])

    JPG = ""

    for file in directory:
        if file.lower().endswith("jpg"):
            JPG = album["path"] + "/" + args["id"] + "/" + file
            break

    response = send_file(
        JPG,
        mimetype="image/jpeg",
        conditional=True
    )

    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    response.headers["Accept-Ranges"] = "bytes"

    stat = os.stat(JPG)
    response.headers["Last-Modified"] = time.gmtime(stat.st_mtime)

    return response

@app.get("/get_video")
def get_video():
    args = dict(request.args)

    user_object = users.get(args["password"])

    if args["album"] not in user_object["albums"]:
        response = Response("false")
        response.headers.add("Content-Type", "application/json")
        return response
    
    album = albums.get(args["album"])

    if args["id"] == "cover":
        args["id"] = album["cover"]

    directory = os.listdir(album["path"] + "/" + args["id"])

    MP4 = ""

    for file in directory:
        if file.lower().endswith("mp4"):
            MP4 = album["path"] + "/" + args["id"] + "/" + file
            break

    if MP4 == "":
        response = Response("false")
        response.status_code = 404
        return response

    response = send_file(
        MP4,
        mimetype="video/mp4",
        conditional=True
    )

    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    response.headers["Accept-Ranges"] = "bytes"

    stat = os.stat(MP4)
    response.headers["Last-Modified"] = time.gmtime(stat.st_mtime)

    return response

@app.get("/admin/get_all_users")
def admin_get_all_users():
    args = dict(request.args)

    if args["admin_password"] != secrets["admin_password"]:
        response = Response("false")
        response.headers.add("Content-Type", "application/json")
        return response

    response = Response(json.dumps(users.get_all()))
    response.headers.add("Content-Type", "application/json")
    return response

@app.get("/admin/delete_user")
def admin_delete_user():
    args = dict(request.args)

    if args["admin_password"] != secrets["admin_password"]:
        response = Response("false")
        response.headers.add("Content-Type", "application/json")
        return response

    user_object = users.get(args["password"])
    user_albums = user_object["albums"]

    for x in user_albums:
        album_object = albums.get(x)
        album_object["people"].remove(args["password"])
        albums.set(x, album_object)
    
    users.delete(args["password"])

    response = Response("true")
    response.headers.add("Content-Type", "application/json")
    return response

@app.get("/admin/add_user_to_album")
def admin_add_user_to_album():
    args = dict(request.args)

    if args["admin_password"] != secrets["admin_password"]:
        response = Response("false")
        response.headers.add("Content-Type", "application/json")
        return response
    
    user_object = users.get(args["password"])
    user_object["albums"].append(args["album"])
    user_object["albums"] = list(set(user_object["albums"]))
    users.set(args["password"], user_object)

    album = albums.get(args["album"])
    album["people"].append(args["password"])
    albums.set(args["album"], album)

    response = Response("true")
    response.headers.add("Content-Type", "application/json")

    mail_html = open("mail/newAlbumAdd.html").read()
    mail_html = mail_html.replace("{name}", user_object["name"]).replace("{password}", user_object["password"]).replace("{album_name}", album["location"])

    resend.Emails.send({"from": "Aarav's Archive <mailing-list@archive.aaravdayal.com>", "to": user_object["email"], "subject": "You were added to the album \"" + album["location"] + "\"", "reply_to": "aarav@dayal.org", "html": mail_html})
    return response

@app.get("/admin/remove_user_from_album")
def admin_remove_user_from_album():
    args = dict(request.args)

    if args["admin_password"] != secrets["admin_password"]:
        response = Response("false")
        response.headers.add("Content-Type", "application/json")
        return response
    
    user_object = users.get(args["password"])
    user_object["albums"].remove(args["album"])
    users.set(args["password"], user_object)

    album = albums.get(args["album"])
    album["people"].remove(args["password"])
    albums.set(args["album"], album)

    response = Response("true")
    response.headers.add("Content-Type", "application/json")
    return response

app.run(host="0.0.0.0", port=4665)