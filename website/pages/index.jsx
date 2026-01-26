import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter } from "@heroui/react"
import { useEffect, useState, useRef } from "react"
import { API_URL } from "../config/variables"
import { useRouter } from "next/router"

export default function App({cookies}) {
    const [isOpen, setModalOpen] = useState(false)
    const [password, setPassword] = useState("")
    const router = useRouter()
    const debounceRef = useRef(null)
    const [authenticating, setAuthenticating] = useState(false)


    useEffect(() => {
        if (cookies.password) {
            router.replace("/albums")
            return
        }

        document.getElementById("password_input").focus()
    }, [cookies.password, router])

    if (cookies.password) {
        return null
    }

    async function authenticate(x) {
        if (authenticating) return;

        setAuthenticating(true)
        var user_object = await (await fetch(API_URL + "/authenticate?password=" + encodeURIComponent(x.target.value))).json()
        setAuthenticating(false)
        
        if (user_object == false) {
            return
        }

        localStorage.setItem("user_object", JSON.stringify(user_object))
        document.cookie = "password=" + encodeURIComponent(x.target.value)
        router.replace("/albums")
    }

    return (
        <>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <div style={{height: "100vh", width: "100vw"}} className="flex justify-center items-center">
            <div style={{marginTop: "-5svh"}}>
                <div className="text-center text-2xl">Welcome to Aarav's Archive!</div>
                <Form onSubmit={(e) => {
                    e.preventDefault()

                    if (debounceRef.current) {
                        clearTimeout(debounceRef.current)
                    }

                    authenticate({"target": document.getElementById("password_input")})
                }}>
                    <Input id="password_input" label="Enter Password" placeholder="Password here" value={password} onChange={(x) => setPassword(x.target.value)} className="xl:w-[500px] w-[300px] pt-5" isClearable onClear={() => setPassword("")} type="password" enterKeyHint="enter"
                        onInput={(x) => {
                            if (debounceRef.current) {
                                clearTimeout(debounceRef.current)
                            }

                            debounceRef.current = setTimeout(() => authenticate(x), 400)
                        }}
                        classNames={{inputWrapper: "data-[hover=true]:bg-[#27272a]"}}
                    ></Input>
                </Form>
                <div className="pt-2 text-[#777] hover:text-[#000] dark:hover:text-[#fff] text-sm pl-2 cursor-pointer" onClick={() => setModalOpen(true)}>Don't have the password?</div>
            </div>
        </div>

        <Modal isOpen={isOpen} onClose={() => setModalOpen(false)} backdrop="blur">
            <ModalContent>
                <ModalBody>
                    <div className="pt-4 font-bold text-xl">Don't have the password?</div>
                    <div>
                        If you don't have the password then just contact Aarav Dayal.
                    </div>
                    <div>
                        Preferably contact Aarav through Whatsapp otherwise use his email: aarav@dayal.org
                    </div>
                    <div>
                        Contacting via email might get a delayed reponse usually within a 24 hour window.
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" variant="ghost" onPress={() => {
                        window.open(
                            "mailto:aarav@dayal.org" +
                            "?subject=" + encodeURIComponent("Requesting Archive Access") +
                            "&body=" + encodeURIComponent("Hi Aarav,\n\n My name is {name_here} and I wanted to access the archive.\n\n We know each other from {place_or_incident}.")
                        )
                    }}>Send Email</Button>
                    <Button color="danger" variant="ghost" onPress={() => setModalOpen(false)}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    )
}

export async function getServerSideProps(context) {
    var raw_cookies = context.req.headers.cookie
    var cookies = Object.fromEntries((raw_cookies ?? "").split("; ").filter(Boolean).map(c => [c.slice(0, c.indexOf("=")), decodeURIComponent(c.slice(c.indexOf("=") + 1))]))

    return {"props": {"cookies": cookies}}
}