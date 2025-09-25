
import { FaInstagramSquare, FaLinkedin, FaFacebookSquare } from 'react-icons/fa';
import { FaSquareXTwitter } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="w-full h-[350px] sm:h-[200px] gap-4 py-4 px-6 bg-[#332475] flex flex-col justify-center items-center">
        <div className="sm:w-full flex flex-col sm:flex-row justify-evenly items-start sm:items-baseline">
            <div className="flex flex-col mr-4 justify-center items-start mb-4 sm:mb-0">
                <div className='flex flex-col'>
                    <span className="text-white font-bold">Sobre Meu Apê</span>
                    <p className="
                        text-white cursor-pointer relative
                        w-max
                        after:absolute after:bottom-0 after:left-0
                        after:h-[2px] after:w-0 after:bg-white
                        after:transition-all after:duration-500
                        hover:after:w-full">
                        Sobre nós
                    </p>
                </div>

                <div className='flex flex-col mt-2'>
                    <span className="text-white font-bold">Políticas</span>
                    <p className="
                        text-white cursor-pointer relative
                        w-max
                        after:absolute after:bottom-0 after:left-0
                        after:h-[2px] after:w-0 after:bg-white
                        after:transition-all after:duration-500
                        hover:after:w-full">
                        Termos e Condições de uso
                    </p>
                    <p className="
                        text-white cursor-pointer relative
                        w-max
                        after:absolute after:bottom-0 after:left-0
                        after:h-[2px] after:w-0 after:bg-white
                        after:transition-all after:duration-500
                        hover:after:w-full">
                        Política de Privacidade
                    </p>
                </div>
                
            </div>
            <div className="flex flex-col mr-4">
                <span className="text-white font-bold">Contatos</span>
                <p className="text-white">Email: contato@meuape.com</p>
                <p className="text-white">Telefone: (11) 1234-5678</p>

                <div className="flex flex-row mt-2 space-x-4">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook">
                        <FaFacebookSquare size={24} color="#ffffff" />
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter">
                        <FaSquareXTwitter size={24} color="#ffffff" />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram">
                        <FaInstagramSquare size={24} color="#ffffff" />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                        <FaLinkedin size={24} color="#ffffff" />
                    </a>
                </div>

                
            </div>
        </div>
        
      <p className="text-white">© {new Date().getFullYear()} Meu Apê. Todos os direitos reservados.</p>
    </footer>
  );
}
