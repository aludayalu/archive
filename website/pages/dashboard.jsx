import { Autocomplete, AutocompleteItem, Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react"
import { useEffect, useState, useRef } from "react"
import { API_URL } from "../config/variables"
import { useRouter } from "next/router"
import { X } from "lucide-react"

export default function Dashboard({cookies}) {
    const router = useRouter()
    const [users, setUsers] = useState([])
    const [albums, setAlbums] = useState([])
    const [userAddModalOpen, setUserAddModalOpen] = useState(false)
    const [editUserModalOpen, setEditUserModalOpen] = useState(false)
    const [editAlbumModalOpen, setEditAlbumModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState({"albums": []})
    const [selectedAlbum, setSelectedAlbum] = useState(null)
    const [processingUpdates, setProcessingUpdates] = useState([])

    if (editAlbumModalOpen) {
        var albumPeople = []

        for (let i = 0; i < users.length; i++) {
            const i_elem = users[i];

            for (let j = 0; j < selectedAlbum.people.length; j++) {
                const j_elem = selectedAlbum.people[j];
                if (i_elem["password"] == j_elem) {
                    albumPeople.push(i_elem)
                }
            }
        }
    }

    useEffect(() => {
        if (localStorage.getItem("user_object") === null) {
            router.replace("/")
        }
    }, [])

    async function referesh_users() {
        var user_object = JSON.parse(localStorage.getItem("user_object"))

        await fetch(API_URL + "/admin/get_all_users?admin_password=" + encodeURIComponent(user_object["password"])).then(async (x) => {
            setUsers(Object.values(await x.json()))
        })
    }

    useEffect(() => {
        referesh_users()
    }, [])

    async function refresh_albums() {
        await fetch(API_URL + "/albums?password=" + encodeURIComponent(JSON.parse(localStorage.getItem("user_object"))["password"])).then(async (x) => {
            var data = await x.json()
            setAlbums(data)
            if (selectedAlbum) {
                for (let index = 0; index < data.length; index++) {
                    const element = data[index];
                    if (element["id"] == selectedAlbum["id"]) {
                        setSelectedAlbum(element)
                        break
                    }
                }
            }
        })
    }

    useEffect(() => {
        refresh_albums()
    }, [])

    if (users === false) {
        router.replace("/")
    }

    return (
        <>
        <div className="flex lg:justify-center">
            <div className="w-[100svw] lg:w-[50svw] p-4">
                <div className="text-4xl">Users</div>
                <Button className="mt-4 mb-1" onPress={() => setUserAddModalOpen(true)}>Add New User</Button>
                <div className="mt-2">
                    {users.map((x) => {
                        return (
                            <>
                            <div style={{border: "1px solid rgba(255, 255, 255, 0.14)"}} className="w-[300px] p-1 cursor-pointer" onClick={() => {
                                setSelectedUser(x)
                                setEditUserModalOpen(true)
                            }}>
                                {x.name}
                            </div>
                            </>
                        )
                    })}
                </div>
            </div>
            <div className="w-[100svw] lg:w-[50svw] p-4">
                <div className="text-4xl">Albums</div>
                <div className="mt-2">
                    {albums.map((x) => {
                        return (
                            <>
                            <div style={{border: "1px solid rgba(255, 255, 255, 0.14)"}} className="w-[300px] p-1 cursor-pointer" onClick={() => {
                                setSelectedAlbum(x)
                                setEditAlbumModalOpen(true)
                            }}>
                                {x.location} on {formatUnixDate(x.time)}
                            </div>
                            </>
                        )
                    })}
                </div>
            </div>
        </div>

        <Modal isOpen={userAddModalOpen} onClose={() => {setUserAddModalOpen(false)}}>
            <ModalContent>
                <ModalHeader>
                    <div className="font-bold text-2xl">Add User</div>
                </ModalHeader>
                <ModalBody>
                    <Input id="new_username" label="Username" placeholder="Username here"></Input>
                    <Input id="new_password" label="Password" placeholder="Password here"></Input>
                    <Input id="new_name" label="Name" placeholder="Name here"></Input>
                    <Input id="new_email" label="Email" placeholder="Email here"></Input>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onPress={async () => {
                        var username = document.getElementById("new_username").value
                        var password = document.getElementById("new_password").value
                        var name = document.getElementById("new_name").value
                        var email = document.getElementById("new_email").value
                        var user_object = JSON.parse(localStorage.getItem("user_object"))

                        var request = await fetch(API_URL + "/add_user?admin_password=" + encodeURIComponent(user_object["password"]) + "&username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password) + "&name=" + encodeURIComponent(name) + "&email=" + encodeURIComponent(email))
                        var data = await request.json()

                        referesh_users()

                        setUserAddModalOpen(false)
                    }}>Submit</Button>
                    <Button color="danger" variant="ghost" onPress={() => setUserAddModalOpen(false)}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>


        <Modal isOpen={editUserModalOpen} onClose={() => {setEditUserModalOpen(false)}}>
            <ModalContent>
                <ModalHeader>
                    <div className="font-bold text-2xl">Deleting {selectedUser.name}</div>
                </ModalHeader>

                <ModalBody>
                    <div>
                        Do you want to delete user {selectedUser?.name}?
                    </div>

                    <div>
                        User is in {selectedUser.albums.length} albums.
                    </div>
                    <Button className="mt-2" color="danger" onPress={async () => {
                        var user_object = JSON.parse(localStorage.getItem("user_object"))
                        var request = await fetch(API_URL + "/admin/delete_user?admin_password=" + encodeURIComponent(user_object["password"]) + "&password=" + encodeURIComponent(selectedUser.password))
                        await request.json()

                        setEditUserModalOpen(false)
                        referesh_users()
                    }}>Delete User</Button>
                </ModalBody>
            </ModalContent>
        </Modal>

        <Modal isOpen={editAlbumModalOpen} onClose={() => {setEditAlbumModalOpen(false)}}>
            <ModalContent>
                <ModalHeader>
                    <div className="font-bold text-2xl">Album {selectedAlbum?.location}</div>
                </ModalHeader>

                <ModalBody>
                    <div className="text-xl">Added Users</div>
                    <div className="flex flex-wrap gap-2">
                        {albumPeople?.map((x) => {
                            var user_object = JSON.parse(localStorage.getItem("user_object"))

                            if (x["password"] == user_object["password"]) {
                                return
                            }

                            return <Button
                                onPress={async () => {
                                    if (!processingUpdates.includes(x["password"])) {
                                        setProcessingUpdates((y) => [...y, x["password"]])
                                        await fetch(API_URL + "/admin/remove_user_from_album?admin_password=" + encodeURIComponent(user_object["password"]) + "&password=" + encodeURIComponent(x.password) + "&album=" + selectedAlbum["id"])
                                        setProcessingUpdates((y) => y.filter((item) => item != x["password"]))
                                        await refresh_albums()
                                    }
                                }}
                            >{x["name"]} {processingUpdates.includes(x["password"]) ? <Spinner size="sm" color=""></Spinner> : <X size={18}></X>}</Button>
                        })}
                    </div>
                    <div className="text-xl">Add New Users</div>
                    <Autocomplete label="Select a user" onSelectionChange={async (x) => {
                        if (!x) return
                        var user_password = x
                        var user_object = JSON.parse(localStorage.getItem("user_object"))

                        async function AddUser() {
                            setProcessingUpdates((y) => [...y, user_password])
                            var copySelectedAlbum = JSON.parse(JSON.stringify(selectedAlbum))
                            copySelectedAlbum["people"].push(user_password)
                            setSelectedAlbum(copySelectedAlbum)
                            await fetch(API_URL + "/admin/add_user_to_album?admin_password=" + encodeURIComponent(user_object["password"]) + "&password=" + encodeURIComponent(user_password) + "&album=" + selectedAlbum["id"])
                            setProcessingUpdates((y) => y.filter((item) => item != user_password))
                            await refresh_albums()
                        }

                        AddUser()

                        return {
                            "inputValue": "",
                            "selectedKey": ""
                        }
                    }}>
                        {users.filter((user) => !selectedAlbum?.people?.includes(user.password)).map((user) => {
                            return <AutocompleteItem key={user["password"]}>{user.name}</AutocompleteItem>
                        })}
                    </Autocomplete>
                </ModalBody>
            </ModalContent>
        </Modal>
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