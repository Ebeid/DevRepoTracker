import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Code, Lightbulb, Clock, FileText, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface RepositoryCodeSearchProps {
  repositoryId: number;
  repositoryName: string;
}

// Mock code snippets with various file extensions and content
const mockCodeSnippets = [
  {
    id: 1,
    fileName: "index.js",
    path: "src/index.js",
    language: "javascript",
    content: `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
    highlights: [{ line: 1, column: 7, length: 5 }],
  },
  {
    id: 2,
    fileName: "App.js",
    path: "src/App.js",
    language: "javascript",
    content: `import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
  }, []);

  return (
    <BrowserRouter>
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;`,
    highlights: [{ line: 1, column: 10, length: 8 }, { line: 7, column: 19, length: 8 }],
  },
  {
    id: 3,
    fileName: "UserRepository.java",
    path: "src/main/java/com/example/repository/UserRepository.java",
    language: "java",
    content: `package com.example.repository;

import com.example.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    @Query("SELECT u FROM User u WHERE u.email = ?1")
    Optional<User> findByEmail(String email);
    
    List<User> findAllByActiveTrue();
}`,
    highlights: [{ line: 11, column: 18, length: 14 }],
  },
  {
    id: 4,
    fileName: "main.py",
    path: "src/main.py",
    language: "python",
    content: `import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

if __name__ == '__main__':
    app.run(debug=True)`,
    highlights: [{ line: 9, column: 7, length: 4 }],
  },
  {
    id: 5,
    fileName: "api.go",
    path: "api/api.go",
    language: "go",
    content: `package api

import (
	"encoding/json"
	"log"
	"net/http"
	
	"github.com/gorilla/mux"
	"github.com/example/repo/models"
	"github.com/example/repo/database"
)

// UserHandler handles user-related HTTP requests
func UserHandler(w http.ResponseWriter, r *http.Request) {
	db := database.GetConnection()
	users, err := models.GetAllUsers(db)
	
	if err != nil {
		log.Printf("Error fetching users: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// SetupRoutes configures the API routes
func SetupRoutes() *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/api/users", UserHandler).Methods("GET")
	return r
}`,
    highlights: [{ line: 14, column: 6, length: 11 }],
  },
];

// AI suggestion messages
const aiSuggestions = [
  "Try searching for 'authentication' to find login-related code",
  "Look for 'database connection' patterns in your repositories",
  "Search for 'error handling' to review exception patterns",
  "Try 'API endpoints' to locate your service interfaces",
  "Look for 'state management' in frontend components",
];

// Mock recent searches
const recentSearches = [
  "authentication",
  "database connection",
  "error handling",
  "api endpoints",
  "state management",
];

export default function RepositoryCodeSearch({ repositoryId, repositoryName }: RepositoryCodeSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof mockCodeSnippets>([]);
  const [selectedResult, setSelectedResult] = useState<(typeof mockCodeSnippets)[0] | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Show AI suggestion after user stops typing
  useEffect(() => {
    if (query.length > 2) {
      const suggestionTimer = setTimeout(() => {
        const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
        setCurrentSuggestion(randomSuggestion);
        setShowSuggestion(true);
      }, 1500);

      return () => clearTimeout(suggestionTimer);
    } else {
      setShowSuggestion(false);
    }
  }, [query]);

  const performSearch = () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowSuggestion(false);

    // Simulate API call delay
    setTimeout(() => {
      // Filter mock data based on query (case-insensitive)
      const lowerQuery = query.toLowerCase();
      const results = mockCodeSnippets.filter(
        (snippet) =>
          snippet.fileName.toLowerCase().includes(lowerQuery) ||
          snippet.content.toLowerCase().includes(lowerQuery)
      );

      setSearchResults(results);
      setIsSearching(false);

      // Show toast with search results summary
      toast({
        title: `Search Results: ${results.length} files found`,
        description: results.length
          ? `Found matches in ${results.map((r) => r.fileName).join(", ")}`
          : "No matches found for your query",
      });
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const applySuggestion = () => {
    // Extract the suggestion text between quotes if present
    const extractedSuggestion = currentSuggestion.match(/'([^']+)'/);
    const newQuery = extractedSuggestion ? extractedSuggestion[1] : currentSuggestion.split(" ")[1];
    
    setQuery(newQuery);
    setShowSuggestion(false);
    
    // Focus the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Perform search with new query
    setTimeout(() => performSearch(), 100);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-4 h-4" />
          Repository Code Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  placeholder="Search code with natural language queries..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-8"
                />
                {query && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setQuery("")}
                  >
                    &times;
                  </button>
                )}
              </div>
              <Button onClick={performSearch} disabled={isSearching}>
                {isSearching ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>

            {/* AI suggestion */}
            <AnimatePresence>
              {showSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-1 p-2 bg-muted rounded-md border flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm">{currentSuggestion}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={applySuggestion}>
                    Apply
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent searches */}
          {!searchResults.length && !isSearching && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setQuery(search);
                      performSearch();
                    }}
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Search className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground">Searching repository code...</p>
            </div>
          )}

          {searchResults.length > 0 && !isSearching && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">
                {searchResults.length} {searchResults.length === 1 ? "result" : "results"} found
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {searchResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`border rounded-md overflow-hidden cursor-pointer transition-colors hover:border-primary ${
                        selectedResult?.id === result.id ? "border-primary ring-1 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="flex items-center justify-between bg-muted p-2 text-sm">
                        <div className="flex items-center">
                          <FileText className="w-3 h-3 mr-2" />
                          <span className="font-medium">{result.fileName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.path}</span>
                      </div>
                      <div className="p-2 text-xs font-mono overflow-x-auto max-h-40 bg-card">
                        <pre>{result.content.split("\n").slice(0, 8).join("\n")}...</pre>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Selected search result detail */}
          {selectedResult && (
            <motion.div
              className="mt-6 border rounded-md overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-primary p-3 text-primary-foreground flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="font-medium">{selectedResult.fileName}</span>
                </div>
                <span className="text-xs">{selectedResult.path}</span>
              </div>
              <div className="p-4 text-sm font-mono overflow-x-auto bg-card">
                <pre>{selectedResult.content}</pre>
              </div>
              <div className="p-3 bg-muted border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Language: {selectedResult.language}</span>
                <Button size="sm" variant="outline">
                  View in GitHub
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
