import { me } from "appbit";
import document from "document";
import * as fs from "fs";
import { inbox } from "file-transfer";
import * as jpeg from "jpeg";
import { HeartRateSensor } from "heart-rate";
import * as messaging from "messaging";

var hrm = new HeartRateSensor();

const bgImg = "/private/data/bg.jpg.txi";
const settingsFile = "/private/data/settings.txt";
const settings = {};
const imageBackground = document.getElementById("imageBackground");
let iconWrappers = document
    .getElementsByClassName("icon")
    .map((iconWrapper) => ({ iconWrapper, speed: 1, enable: false }));
let lastHeartRate;
let animationFrameId;

messaging.peerSocket.addEventListener("message", (evt) => {
    if (evt.data.icon) {
        let selectedIcon = "icon-bubble.png";
        if (evt.data.icon === "heart") {
            selectedIcon = "icon-heart.png";
        } else {
            selectedIcon = "icon-bubble.png";
        }
        console.log(`Received Selected Icon: ${selectedIcon}`);
        iconWrappers.forEach(({ iconWrapper }) => {
            iconWrapper.getElementById("icon-img").image = selectedIcon;
        });
        settings.icon = selectedIcon;
    }
});

hrm.onreading = function () {
    // Peek the current sensor values
    if (!lastHeartRate) {
        lastHeartRate = hrm.heartRate;
        initiateIconsPosition(lastHeartRate);
        disableUnusedIcons(lastHeartRate);
    } else if (Math.abs(lastHeartRate - hrm.heartRate) > 2) {
        lastHeartRate = hrm.heartRate;
        initiateIconsPosition(lastHeartRate);
        disableUnusedIcons(lastHeartRate);
    }
};

main();

inbox.onnewfile = () => {
    let fileName;
    do {
        fileName = inbox.nextFile();
        if (fileName) {
            if (fs.existsSync(bgImg)) {
                fs.unlinkSync(bgImg);
            }
            let outFileName = fileName + ".txi";
            jpeg.decodeSync(fileName, outFileName);
            fs.unlinkSync(fileName);
            main();
        }
    } while (fileName);
};

function getMaxNumberOfIcons(heartRate) {
    let percentage = 0;
    if (heartRate > 120) {
        percentage = 100;
    } else if (heartRate <= 120 && heartRate > 100) {
        percentage = 90;
    } else if (heartRate <= 100 && heartRate > 90) {
        percentage = 75;
    } else if (heartRate <= 90 && heartRate > 80) {
        percentage = 60;
    } else if (heartRate <= 80 && heartRate > 75) {
        percentage = 30;
    } else if (heartRate <= 75 && heartRate > 70) {
        percentage = 10;
    } else if (heartRate <= 70) {
        percentage = 5;
    }

    const totalIcons = Math.floor((iconWrappers.length * percentage) / 100);
    console.log(`HR: ${heartRate}, using ${totalIcons} icons`);
    return totalIcons;
}

function initiateIconsPosition(heartRate) {
    if (!heartRate) {
        heartRate = 70;
    }
    const maxNumberOfIcons = getMaxNumberOfIcons(heartRate);
    for (let i = 0; i < maxNumberOfIcons; i++) {
        let iconWrapperObj = iconWrappers[i];
        const iconWrapper = iconWrapperObj.iconWrapper;
        let icon = iconWrapper.getElementById("icon");
        icon.style.display = "inline";
        iconWrapper.x = Math.floor(Math.random() * 301);
        iconWrapper.y = 280;
        iconWrapper.animate("enable");
        iconWrapperObj.enable = true;
    }
}

function disableUnusedIcons(heartRate) {
    const maxNumberOfIcons = getMaxNumberOfIcons(heartRate);
    for (let i = maxNumberOfIcons; i < iconWrappers.length; i++) {
        let iconWrapperObj = iconWrappers[i];
        const iconWrapper = iconWrapperObj.iconWrapper;
        iconWrapperObj.enable = false;
        let icon = iconWrapper.getElementById("icon");
        icon.style.display = "none";
        iconWrapper.x = 0;
        iconWrapper.y = 0;
        iconWrapper.animate("disable");
    }
}

function getRandomSpeed() {
    let speeds = [1, 2, 3, 4, 5];
    const randomIndex = Math.floor(Math.random() * speeds.length);
    return speeds[randomIndex];
}

function animateIcons(timestamp) {
    iconWrappers.forEach((iconWrapper) => {
        iconWrapper.speed = getRandomSpeed();
        return iconWrapper;
    });

    iconWrappers
        .filter(({ enable }) => enable)
        .forEach(({ iconWrapper, speed }) => {
            if (iconWrapper.y < speed) {
                iconWrapper.x = Math.floor(Math.random() * 301);
                iconWrapper.y = 280;
            } else {
                iconWrapper.y -= speed;
            }
        });

    requestAnimationFrame(animateIcons);
}

function main() {
    if (fs.existsSync(bgImg) && fs.existsSync(settingsFile)) {
        settings = fs.readFileSync(settingsFile, "cbor");
        console.log(`Loaded settings: ${JSON.stringify(settings)}`);
        imageBackground.image = bgImg;
        if (!animationFrameId) {
            console.log("Initializing animation!");
            // Begin monitoring the sensor
            hrm.start();
            initiateIconsPosition();
            animationFrameId = requestAnimationFrame(animateIcons);
        } else {
            console.log("Animation ID already exists!");
        }
    }
}

me.onunload = function () {
    fs.writeFileSync(settingsFile, settings, "cbor");
};
