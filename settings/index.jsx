function mySettings(props) {
    let screenWidth = props.settingsStorage.getItem("screenWidth");
    let screenHeight = props.settingsStorage.getItem("screenHeight");

    return (
        <Page>
            <ImagePicker
                title="Background Image"
                description="Pick an image to use as your background."
                label="Pick a Background Image"
                sublabel="Background image picker"
                settingsKey="background-image"
                imageWidth={screenWidth}
                imageHeight={screenHeight}
            />
            <Select
                label={"Select Icon"}
                settingsKey="selectedIcon"
                options={[
                    { name: "Heart", value: "heart" },
                    { name: "Bubble", value: "bubble" },
                ]}
            />
        </Page>
    );
}

registerSettingsPage(mySettings);
