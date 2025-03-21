import React, { useState } from 'react';
import { Search  } from 'react-feather'

export default function SearchBar({ books = [], onBookPress }) { // Valeur par défaut pour books
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{backgroundColor: '#f5f5f5',width:'90%',borderRadius:10,padding:12}}>
        <div style={{display:'flex'}}>
        <Search color='gray'/>
        <input
          style={{
            width: "100%",
            marginLeft: 10,
            color: 'black',
            backgroundColor: "transparent",
            border: "none",
            outline: "none", // Ajout pour enlever l'outline
          }}
          placeholder="Rechercher un livre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
          
        </div>
        
      
      {searchQuery.length > 0 && (
        <div className="mt-4">
          {filteredBooks.map((item) => (
            <div
              key={item.id}
              className="flex items-center mb-4 cursor-pointer"
              onClick={() => onBookPress(item)}
              style={{display:'flex',alignItems:'center'}}
            >
              <img style={{height: 50,width: 50,borderRadius: 5,marginRight: 10,}} src={item.coverUrl} alt={item.name} className="" />
              <p className="" style={{fontSize: 16,color: '#000',}}>{item.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
