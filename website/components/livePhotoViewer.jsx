import { useEffect, useRef, useState } from "react";
import { API_URL } from "../config/variables";
import { Card, CardHeader, Image } from "@heroui/react"

export function LivePhotoViewer({album, id, onPress, square, showDate, showLocation}) {
    const cardRef = useRef(null);
    const [inView, setInView] = useState(false);
    const [hasVideo, setHasVideo] = useState(false)
    const [hovering, setHovering] = useState(false)
    const videoRef = useRef(null)
    const [orientation, setOrientation] = useState(null)
    const user = JSON.parse(localStorage.getItem("user_object"));
    const videoURL = API_URL + "/get_video" + "?password=" + encodeURIComponent(user.password) + "&album=" + album.id + "&id=" + id;
    const [playingOnceOnScroll, setPlayingOnceOnScroll] = useState(false)
    const playVideo = hasVideo && inView && orientation !== null && (hovering || playingOnceOnScroll)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.01 }
        );

        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!inView) {
            setHovering(false);
            return;
        }

        setPlayingOnceOnScroll(true)
    }, [inView]);


    const spanClass = orientation === "vertical" ? "row-span-3" : ""

    return (
        <div className={"cursor-pointer " + spanClass} onMouseEnter={() => {
            setHovering(true)

            if (!playVideo) {
                videoRef.current.currentTime = 0
            }
            videoRef.current.play()
        }} onMouseLeave={() => setHovering(false)} onClick={onPress}>
        <Card className={"w-full h-full " + (square ? "aspect-square" : "") + (orientation == "horizontal" ? "aspect-[5/3]" : "")} ref={cardRef} radius="none" shadow="none">
            <CardHeader className="absolute z-10 top-1 flex-col items-start!">
                {showDate && <p className="text-sm text-white/60 uppercase font-bold">{formatUnixDate(album.time)}</p>}
                {showLocation && <h4 className="text-white font-medium text-lg">{album.location}</h4>}
            </CardHeader>
            <Image
                removeWrapper
                radius="none" shadow="none"
                style={{border: "0.1px solid rgba(255, 255, 255, 0.14"}}
                className={"z-0 w-full h-full object-cover " + ((playVideo) ? "hidden" : "")}
                src={API_URL + "/get_image?password=" + encodeURIComponent(JSON.parse(localStorage.getItem("user_object"))["password"]) + "&album=" + album["id"] + "&id=" + id}
                onLoad={(e) => {
                    const img = e.target
                    const width = img.naturalWidth
                    const height = img.naturalHeight

                    let new_orientation

                    if (height > width) {
                        new_orientation = "vertical"
                    } else {
                        new_orientation = "horizontal"
                    }

                    setOrientation(new_orientation)
                }}
            />
            <video ref={videoRef} onEnded={() => {
                if (!hovering) {
                    setPlayingOnceOnScroll(false)
                }
            }} 
            onLoadedMetadata={() => {setHasVideo(true)}}
            onError={() => {
                setHasVideo(false)
            }}
            autoPlay playsInline loop={hovering} muted={!hovering} preload="auto" className={"z-0 w-full h-full object-cover " + ((!(playVideo)) ? "hidden" : "")} src={videoURL}></video>
        </Card>
        </div>
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