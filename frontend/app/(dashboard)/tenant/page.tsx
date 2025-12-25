"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Welcome Home</h2>
                <Button variant="outline">Raise Request</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Unit</CardTitle>
                        <CardDescription>Apt 4B, Sunrise Apartments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Lease Active until Dec 2026</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Next Payment</CardTitle>
                        <CardDescription>Due on Jan 1st</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">$1,200</div>
                        <Button className="mt-4 w-full">Pay Now</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
