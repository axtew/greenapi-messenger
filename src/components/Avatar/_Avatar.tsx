import { useState } from "react";
import { useTheme } from "styled-components";

import { getAvatarColor, getInitials } from "./_helpers";
import { SImage, SRoot } from "./_styles";

interface IAvatarProps {
  chatId: string;
  name: string;
  avatarUrl: string | null;
  /** Диаметр в пикселях. */
  size: number;
}

/**
 * Круглый аватар собеседника: фото, а без него или при ошибке загрузки — инициалы на цветном фоне.
 *
 * Декоративный: имя всегда выводится рядом текстом, поэтому для скринридера аватар скрыт.
 */
export function Avatar({ chatId, name, avatarUrl, size }: IAvatarProps) {
  const { palette } = useTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const isImageShown = avatarUrl !== null && avatarUrl !== failedUrl;

  return (
    <SRoot $size={size} $background={getAvatarColor(chatId, palette.avatarColors)} aria-hidden>
      {isImageShown ? (
        <SImage src={avatarUrl} alt="" onError={() => setFailedUrl(avatarUrl)} />
      ) : (
        getInitials(name)
      )}
    </SRoot>
  );
}
