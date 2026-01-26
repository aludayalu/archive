import sqlite3, traceback, json, os, threading

class Connection:
    def __init__(self, collection) -> None:
        self.collection = collection
        self.lock = threading.Lock()

    def set(self, key, val):
        self.lock.acquire()

        try:
            set(self.collection, key, json.dumps(val))
        except:
            pass

        self.lock.release()

    def get(self, key):
        self.lock.acquire()
        try:
            result = json.loads(get(self.collection, key))
            self.lock.release()
            return result
        except:
            self.lock.release()
            return None

    def get_all(self, n=-1):
        try:
            return {key: json.loads(val) for key, val in get_all(self.collection, n=n)[::-1]}
        except Exception as e:
            traceback.print_exc()
            return None
    
    def delete(self, key):
        try:
            self.lock.acquire()
            delete(self.collection, key)
            self.lock.release()
        except Exception as e:
            self.lock.release()
            traceback.print_exc()
            return False
    
    def count_all(self):
        self.lock.acquire()
        try:
            count = count_all(self.collection)
            self.lock.release()
            return count
        except:
            pass
        self.lock.release()

def get_conn(name):
    try:
        os.mkdir("databases")
    except:
        pass
    conn = sqlite3.connect(f"databases/{name}", check_same_thread=False)
    cursor = conn.cursor()
    query1 = "CREATE TABLE IF NOT EXISTS main(x TEXT PRIMARY KEY, y TEXT)"
    cursor.execute(query1)
    conn.commit()
    return Connection(conn)

def set(conn, key, val, iterations=0):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM main WHERE x = ?", (key,))
        if len(cursor.fetchall()) == 0:
            query2 = "INSERT INTO main VALUES (?, ?)"
            cursor.execute(query2, (key, val))
            conn.commit()
        else:
            cursor.execute("UPDATE main SET y = ? WHERE x = ?", (val, key))
            conn.commit()
    except Exception as e:
        if iterations > 4:
            traceback.print_exc()
            raise e
        set(conn, key, val, iterations + 1)

def get(conn, key, iterations=0):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM main WHERE x = ?", (key,))
        data = cursor.fetchall()
        if len(data) == 0:
            return False
        return list(data[0])[1]
    except Exception as e:
        if iterations > 4:
            traceback.print_exc()
            raise e
        return get(conn, key, iterations + 1)

def get_all(conn, iterations=0, n=-1):
    try:
        cursor = conn.cursor()
        if n == -1:
            cursor.execute("SELECT * FROM main")
        else:
            cursor.execute("SELECT * FROM main ORDER BY rowid DESC LIMIT ?", (n,))

        data = cursor.fetchall()
        return data
    except Exception as e:
        if iterations > 4:
            traceback.print_exc()
            raise e
        return get_all(conn, iterations + 1, n)


def delete(conn, key, iterations=0):
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM main WHERE x = ?", (key,))
        conn.commit()
    except Exception as e:
        if iterations > 4:
            traceback.print_exc()
            raise e
        return delete(conn, key, iterations + 1)

def count_all(conn, iterations=0):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM main")
        count = cursor.fetchone()[0]
        return count
    except Exception as e:
        if iterations > 4:
            traceback.print_exc()
            raise e
        return count_all(conn, iterations + 1)