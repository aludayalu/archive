import { useEffect, useState } from "react";
import { useRouter } from "next/router"
import { API_URL } from "../../config/variables"
import { LivePhotoViewer } from "../../components/livePhotoViewer";
import { ChevronLeft } from "lucide-react"

export default function Album() {
    const router = useRouter()
    const [album, setAlbum] = useState(null)

    useEffect(() => {
        if (localStorage.getItem("user_object") === null) {
            router.replace("/")
        }
    }, [])

    useEffect(() => {
        var slug = router.query.slug
        
        if (slug) {
            fetch(API_URL + "/album?password=" + encodeURIComponent(JSON.parse(localStorage.getItem("user_object"))["password"]) + "&album=" + slug).then(async (x) => setAlbum(await x.json()))
        }
    }, [router.query.slug])

    if (album === false) {
        return (
            <div style={{height: "100svh"}} className="flex justify-center items-center">
                <div>
                    <div className="text-center">
                        Kindly contact Aarav Dayal.
                    </div>
                    <div>
                        You don't have access to this album.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
        <div style={{position: "fixed", zIndex: 100, left: 20, top: 20, borderRadius: "50%", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.14)"}}>
            <div style={{padding: "8px"}} className="cursor-pointer" onClick={() => router.push("/albums")}>
                <ChevronLeft height={30} width={30} size={30}></ChevronLeft>
            </div>
        </div>
        <div style={{position: "fixed", zIndex: 100, width: "100svw", bottom: 20}} className="flex justify-center items-center">
            <div style={{borderRadius: "14px", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.14)"}} className="pt-2 pb-2 pl-4 pr-4">
                <div className="text-2xl font-bold text-center">
                    {album?.location}
                </div>
                <div className="text-center text-sm">
                    {formatUnixDate(album?.time)}
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 auto-rows-[minmax(0,1fr)]">
            {album?.images.map((image) => {
                return <LivePhotoViewer album={album} id={image} showDate={false}></LivePhotoViewer>
            })}
        </div>
        </>
    )
}

function formatUnixDate(unixSeconds) {
    const d = new Date(unixSeconds * 1000)

    const day = d.getUTCDate()
    const year = d.getUTCFullYear()

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const month = months[d.getUTCMonth()]

    const suffix =
        day % 10 === 1 && day !== 11 ? "st" :
        day % 10 === 2 && day !== 12 ? "nd" :
        day % 10 === 3 && day !== 13 ? "rd" :
        "th"

    return `${day}${suffix} ${month} ${year}`
}