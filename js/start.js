/***
 * Minimap Plugin 
 * It only displays the location of users who are at most 60 meters away from the current user in the world.
 * The other users within the world is mapped onto the minimap relative to the where the current user is looking at (ie the same direction as to where the camera is rotated).
 * 
*/ 

import packageJson from '../package.json'

export default class MinimapPlugin {

    // Plugin information
    id              = packageJson.metapress?.id || packageJson.name
    name            = packageJson.metapress?.name || packageJson.name
    description     = packageJson.metapress?.description || packageJson.description
    version         = packageJson.version
    provides        = [ ]
    requires        = [ 'avatar', 'camera' ]

    /** Timer to update the minimap */
    updateTimer = null

    /** Container of the minimap */
    minimap = null

    /** Canvas of which to draw out the users in the space */
    canvas = null

    /** Distance away from the current user */
    distanceAway = 60

    /** Called on load */
    onLoad() {
        // create a minimap container
        if (!metapress?.contentDiv) {
            setTimeout(() => this.onLoad(), 1000)
        }

        this.createMinimapUI()

        this.updateTimer = setInterval(() => this.updateMinimap(), 1000)
    }

    /** Called on unload */
    onUnload() {
        clearInterval(this.updateTimer)

        // Remove the minimap container
        metapress.contentDiv.removeChild(this.minimap)
    }

    /** Called to create minimap UI */
    createMinimapUI() {
        // Create the minimap UI
        this.minimap = document.createElement('div')
        this.minimap.id = 'minimap.plugin.container'
        this.minimap.style.cssText = `display: flex; position: absolute; right: 10px; top: 10px; width: 140px; height: 140px; flex-shrink: 0; border-radius: 50%; border: 2px solid rgb(27, 27, 27); background-color: rgb(53, 53, 53); box-shadow: rgba(0, 0, 0, 0.25) 2px 2px 6px 0px; overflow: hidden; align-items: center;`

        // Add the current user to the minimap
        const userElem = document.createElement('div')
        userElem.id = 'minimap.plugin.currentuser.elem'
        userElem.style.cssText = `width: 10px; height: 10px; border-radius: 50%; background-color:  #188545; position: absolute; z-index: 99;`

        // Add radius circle
        const circleElem = document.createElement('div')
        circleElem.style.cssText = `width: 40px; height: 40px; border: 2px solid white; background-color: #a8ffc0; opacity: 0.2; border-radius: 50%; position: absolute;`

        // create a round canvas to draw up the other users in the space
        this.canvas = document.createElement('canvas')
        this.canvas.id = 'minimap.plugin.canvas'
        this.canvas.width = 140
        this.canvas.height = 140
        this.canvas.style.cssText = `position: absolute; border-radius: 50%; overflow: hidden;`

        this.minimap.appendChild(userElem)
        this.minimap.appendChild(circleElem)
        this.minimap.appendChild(this.canvas)

        // Append the minimap to the container
        metapress.contentDiv.appendChild(this.minimap)

        // Set the userElem & circleElem position to the calculated center coordinates
        userElem.style.left = `${this.minimap.offsetWidth / 2 - userElem.offsetWidth / 2}px`
        userElem.style.top = `${this.minimap.offsetHeight / 2 - userElem.offsetHeight / 2}px`

        circleElem.style.left = `${this.minimap.offsetWidth / 2 - circleElem.offsetWidth / 2}px`
        circleElem.style.top = `${this.minimap.offsetHeight / 2 - circleElem.offsetHeight / 2}px`

    }

    /** Called to update the minimap */
    updateMinimap() {
        // list of other people in the world
        const avatars = metapress.avatar.users

        const currentUser= {}
        Object.assign(currentUser, metapress.avatar.currentUserEntity)

        // get the canvas context
        const ctx = this.canvas.getContext('2d')

        // clear the canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // get the distance between the current user and the other users
        avatars.forEach(avatar => {
            const otherUser = avatar._avatarEntity
            
            if (!otherUser) return
            
            const distance = metapress.avatar.distanceTo(otherUser)
            // avatar who are <= 60 meters away
            if (distance <= this.distanceAway) {
                this.mapUserToCanvas(otherUser, ctx, currentUser)
            }

        })

    }

    /** Called to map the user to the canvas */
    mapUserToCanvas(otherUser, ctx, currentUser) {
        // camera position
        const cameraPos = metapress.camera.v3a

        // angle in radians
        let angle = Math.atan2(cameraPos.z - currentUser.z, cameraPos.x - currentUser.x)
        angle = metapress.camera.zoom > 0 ? angle : angle + Math.PI / 2

        // other user coordinate relative to the current user
        const otherUserMapXUnrotated = otherUser.x - currentUser.x
        const otherUserMapYUnrotated = otherUser.z - currentUser.z

        // new coordinates after rotation
        const otherUserMapX = otherUserMapXUnrotated * Math.cos(angle) + otherUserMapYUnrotated * Math.sin(angle)
        const otherUserMapY = -otherUserMapXUnrotated * Math.sin(angle) + otherUserMapYUnrotated * Math.cos(angle)

        // coordinates of where the dot should be drawn
        let coordX, coordY = null

        const canvasDistance = (this.canvas.width / 2) / this.distanceAway
        coordX = canvasDistance * otherUserMapX + this.canvas.width / 2
        coordY = canvasDistance * otherUserMapY + this.canvas.height / 2

        // draw the user
        ctx.fillStyle = "red"
        ctx.fillRect(coordX, coordY, 10, 8)
    }

}