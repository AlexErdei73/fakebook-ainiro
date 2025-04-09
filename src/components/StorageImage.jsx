import React, { useState } from "react";
import placeholderImage from "../images/placeholder-image.jpg";
import fakebookAvatar from "../images/fakebook-avatar.jpeg";
import backgroundServer from "../images/background-server.jpg";
import { useEffect } from "react";

const StorageImage = (props) => {
  const { storagePath, alt, ...rest } = props;

  const PLACEHOLDER_AVATAR_STORAGE_PATH = "fakebook-avatar.jpeg";
  const PLACEHOLDER_BACKGROUND_STORAGE_PATH = "background-server.jpg";

  const [url, setUrl] = useState(placeholderImage);

  function changeStoragePath(storagePath) {
    const words = storagePath.split(".");
    words[words.length - 1] = "webp";
    return words.join(".");
  }

  useEffect(() => {
    //We filter out placeholder pictures
    if (storagePath === PLACEHOLDER_AVATAR_STORAGE_PATH) {
      setUrl(fakebookAvatar);
    } else if (storagePath === PLACEHOLDER_BACKGROUND_STORAGE_PATH) {
      setUrl(backgroundServer);
    } else {
      const storagePathParts = changeStoragePath(storagePath).split("/");
      const len = storagePathParts.length;
      const folder = `fakebook/${storagePathParts[len - 2]}`;
      const filename = storagePathParts[len - 1];
      setUrl(
        `https://alexerdei-team.us.ainiro.io/magic/modules/fakebook/image?folder=${folder}&filename=${filename}`
      );
    }
  }, [storagePath]);

  return <img src={url} alt={alt} {...rest} />;
};

export default StorageImage;
