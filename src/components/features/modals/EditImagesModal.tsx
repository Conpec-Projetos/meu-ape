import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function EditImagesModal({ onClose, onSave, images }: {
  onClose: () => void;
  onSave: (imgs: string[]) => void;
  images: string[];
}) {
  const [imgs, setImgs] = useState(images);
  const [newImg, setNewImg] = useState("");

  function handleAdd() {
    if (newImg) {
      setImgs([...imgs, newImg]);
      setNewImg("");
    }
  }

  function handleRemove(idx: number) {
    setImgs(imgs.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(imgs);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Editar Imagens</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {imgs.map((img, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <img src={img} alt="img" className="w-16 h-16 object-cover rounded" />
                <Button type="button" size="icon" variant="outline" onClick={() => handleRemove(idx)}>x</Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newImg}
              onChange={e => setNewImg(e.target.value)}
              placeholder="URL da imagem"
              className="border rounded px-2 py-1 flex-1"
            />
            <Button type="button" onClick={handleAdd}>Adicionar</Button>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-black text-white">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
