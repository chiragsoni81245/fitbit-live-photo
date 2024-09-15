import { device } from "peer";
import { settingsStorage } from "settings";
import { outbox } from "file-transfer";
import { Image } from "image";
import * as messaging from "messaging";

settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);

function sendMessage(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        // Send the data to peer as a message
        messaging.peerSocket.send(data);
    } else {
        console.log("Connection is not opened yet!");
    }
}

messaging.peerSocket.addEventListener("open", (evt) => {
    console.log("Ready to send or receive messages");
});

messaging.peerSocket.addEventListener("error", (err) => {
    console.error(`Connection error: ${err.code} - ${err.message}`);
});

settingsStorage.onchange = function (evt) {
    if (evt.key === "background-image") {
        compressAndTransferImage(evt.newValue);
    }
    if (evt.key === "selectedIcon") {
        let selectedIcon = JSON.parse(evt.newValue).values[0].value;
        if (!selectedIcon) return;
        console.log(`Selected Icon: ${selectedIcon}`);
        sendMessage({ icon: selectedIcon });
    }
};

function compressAndTransferImage(settingsValue) {
    const imageData = JSON.parse(settingsValue);
    Image.from(imageData.imageUri)
        .then((image) =>
            image.export("image/jpeg", {
                background: "#FFFFFF",
                quality: 40,
            })
        )
        .then((buffer) => outbox.enqueue(`bg.jpg`, buffer))
        .then((fileTransfer) => {
            console.log(`Enqueued ${fileTransfer.name}`);
        });
}
