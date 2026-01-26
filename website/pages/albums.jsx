import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router"
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react"
import { Ellipsis } from "lucide-react"
import { API_URL } from "../config/variables"
import { LivePhotoViewer } from "../components/livePhotoViewer";

export default function Albums() {
    const router = useRouter()
    const [albums, setAlbums] = useState(null)

    useEffect(() => {
        if (localStorage.getItem("user_object") === null) {
            router.replace("/")
        }
    }, [])

    useEffect(() => {
        fetch(API_URL + "/albums?password=" + encodeURIComponent(JSON.parse(localStorage.getItem("user_object"))["password"])).then(async (x) => {
            setAlbums(await x.json())
        })
    }, [])

    return (
        <>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <div style={{width: "100svw"}}>
            <div className="p-4 flex justify-between">
                <div className="font-bold text-3xl">Memories</div>
                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly>
                            <Ellipsis></Ellipsis>
                        </Button>
                    </DropdownTrigger>

                    <DropdownMenu>
                        <DropdownItem key="logout" onPress={() => {
                            localStorage.clear()
                            document.cookie = "password=; Max-Age=0; path=/"
                            router.replace("/")
                        }}>
                            Log out
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>

            </div>

            {albums?.length == 0 && <div style={{height: "40svh", width: "100svw"}} className="flex justify-center items-center text-2xl">No Albums Shared Yet</div>}

            <div className="p-2 lg:p-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {albums?.map((album) => <LivePhotoViewer album={album} square showDate showLocation id={"cover"} onPress={() => router.push("/album/" + album.id)}></LivePhotoViewer>)}
            </div>
        </div>
        </>
    )
}