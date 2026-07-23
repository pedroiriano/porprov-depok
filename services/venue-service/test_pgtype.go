package main  
import (  
"fmt"  
"github.com/jackc/pgx/v5/pgtype"  
)  
func main() {  
var n pgtype.Numeric  
err := n.Scan(float64(0))  
fmt.Println(err, n.Valid)  
}  
