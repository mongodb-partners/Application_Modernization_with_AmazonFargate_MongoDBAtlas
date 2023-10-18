import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Employee } from './employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private url = 'http://partner-demo-eb-meanstack-dev.us-east-1.elasticbeanstalk.com:5200'; 
  /*private url = 'http://<ipaddress of the server>.us-east-1.elasticbeanstalk.com:5200';*/
  private employees$: Subject<Employee[]> = new Subject();

  constructor(private httpClient: HttpClient) { }

  private refreshEmployees() {
    this.httpClient.get<Employee[]>(`${this.url}/employees`)
      .subscribe(employees => {
        this.employees$.next(employees);
      });
  }

  getEmployees(): Subject<Employee[]> {
    this.refreshEmployees();
    return this.employees$;
  }

  getEmployee(id: string): Observable<Employee> {
    return this.httpClient.get<Employee>(`${this.url}/employees/${id}`);
  }

  createEmployee(employee: Employee): Observable<string> {
    return this.httpClient.post(`${this.url}/employees`, employee, { responseType: 'text' });
  }

  updateEmployee(id: string, employee: Employee): Observable<string> {
    return this.httpClient.put(`${this.url}/employees/${id}`, employee, { responseType: 'text' });
  }

  deleteEmployee(id: string): Observable<string> {
    return this.httpClient.delete(`${this.url}/employees/${id}`, { responseType: 'text' });
  }
}