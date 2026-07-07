import React from 'react';
import { motion } from 'motion/react';
import { Idea } from '../types';

interface IdeasScreenProps {
  ideas: Idea[];
  setIsIdeaModalOpen: (isOpen: boolean) => void;
  setSelectedIdea: (idea: Idea) => void;
}

export const IdeasScreen: React.FC<IdeasScreenProps> = ({
  ideas,
  setIsIdeaModalOpen,
  setSelectedIdea,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ideias e Notas</h1>
          <p className="text-gray-500 dark:text-gray-400">Espaço colaborativo para sugestões e melhorias no sistema.</p>
        </div>
        <button 
          onClick={() => setIsIdeaModalOpen(true)}
          className="bg-prosas-blue text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-prosas-blueDark transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Nova Ideia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-4">
              <i className="fas fa-lightbulb text-5xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Nenhuma ideia registrada ainda</h3>
            <p className="text-gray-500 dark:text-gray-400">Seja o primeiro a sugerir algo novo!</p>
          </div>
        ) : (
          ideas.map(idea => (
            <motion.div 
              key={idea.id}
              layoutId={idea.id}
              onClick={() => setSelectedIdea(idea)}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-prosas-blue transition-colors">{idea.title}</h3>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-prosas-blue dark:text-blue-400 px-2 py-1 rounded-full font-bold">
                  {new Date(idea.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-6">{idea.description}</p>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-prosas-blue flex items-center justify-center text-[10px] text-white font-bold">
                    {idea.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{idea.userName}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <i className="far fa-comment"></i> Ver comentários
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
