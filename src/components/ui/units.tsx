
import Image from "next/image";
import purplearrow from "@/assets/purplearrow.png"; 


interface UnidadeProps {
  tipo?: "top" | "middle" ;
}

export default function Unidade({ tipo = "middle" }: UnidadeProps) {

  let borderClass = "border"; 
  if (tipo === "top") borderClass += " border-t-2 rounded-t-lg"; 



  return (
    <div
      className={`h-14 w-full ${borderClass} flex justify-between items-center bg-cinza border-white`}
    >
      <div className="rounded-4xl w-6 ml-4 h-6 border-2 border-[#332475]"></div>
      <Image
        src={purplearrow}
        alt="seta roxa"
        width={15}
        height={10}
        className="mr-4"
      />
    </div>
  );
}
